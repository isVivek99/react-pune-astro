// Initialize Astro's load function
(() => {
  var loadComponent = async (componentFactory) => {
    // Double-await pattern: Get renderer function then execute it
    await (
      await componentFactory()
    )();
  };

  // Set up the Astro global object with the load function
  (self.Astro || (self.Astro = {})).load = loadComponent;

  // Signal that Astro is ready to load components
  window.dispatchEvent(new Event("astro:load"));
})();

// Set up component hydration system
(() => {
  var defineProperty = Object.defineProperty;

  // Helper to set properties with proper descriptors
  var setProp = (obj, propName, value) =>
    propName in obj
      ? defineProperty(obj, propName, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: value,
        })
      : (obj[propName] = value);

  // Helper that ensures property name is a string
  var defineProp = (obj, propName, value) =>
    setProp(obj, typeof propName != "symbol" ? propName + "" : propName, value);

  {
    // Type converters for deserialization of props
    let typeConverters = {
      0: (value) => deserializeObject(value), // Object
      1: (value) => deserializeArray(value), // Array
      2: (value) => new RegExp(value), // RegExp
      3: (value) => new Date(value), // Date
      4: (value) => new Map(deserializeArray(value)), // Map
      5: (value) => new Set(deserializeArray(value)), // Set
      6: (value) => BigInt(value), // BigInt
      7: (value) => new URL(value), // URL
      8: (value) => new Uint8Array(value), // Uint8Array
      9: (value) => new Uint16Array(value), // Uint16Array
      10: (value) => new Uint32Array(value), // Uint32Array
      11: (value) => (1 / 0) * value, // Infinity or -Infinity
    };

    // Convert a value based on its type tag
    let deserializeValue = (tuple) => {
      let [typeId, value] = tuple;
      return typeId in typeConverters
        ? typeConverters[typeId](value)
        : undefined;
    };

    // Deserialize an array of values
    let deserializeArray = (arr) => arr.map(deserializeValue);

    // Deserialize an object's properties
    let deserializeObject = (obj) =>
      typeof obj != "object" || obj === null
        ? obj
        : Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [
              key,
              deserializeValue(value),
            ])
          );

    // Define astro-island custom element
    class AstroIsland extends HTMLElement {
      constructor() {
        super(...arguments);
        defineProp(this, "Component");
        defineProp(this, "hydrator");
        defineProp(this, "hydrate", async () => {
          var parentEl;

          // Don't hydrate if disconnected or no hydrator
          if (!this.hydrator || !this.isConnected) return;

          // Check if inside another island that needs to hydrate first
          let parentIsland =
            (parentEl = this.parentElement) == null
              ? void 0
              : parentEl.closest("astro-island[ssr]");

          // If inside another island, wait for its hydration
          if (parentIsland) {
            parentIsland.addEventListener("astro:hydrate", this.hydrate, {
              once: true,
            });
            return;
          }

          // Collect slot content
          let slots = this.querySelectorAll("astro-slot"),
            slotContent = {},
            templates = this.querySelectorAll("template[data-astro-template]");

          // Process templates
          for (let template of templates) {
            let closestIsland = template.closest(this.tagName);
            if (closestIsland != null && closestIsland.isSameNode(this)) {
              slotContent[
                template.getAttribute("data-astro-template") || "default"
              ] = template.innerHTML;
              template.remove();
            }
          }

          // Process slots
          for (let slot of slots) {
            let closestIsland = slot.closest(this.tagName);
            if (closestIsland != null && closestIsland.isSameNode(this)) {
              slotContent[slot.getAttribute("name") || "default"] =
                slot.innerHTML;
            }
          }

          // Parse props
          let props;
          try {
            props = this.hasAttribute("props")
              ? deserializeObject(JSON.parse(this.getAttribute("props")))
              : {};
          } catch (error) {
            let componentUrl =
                this.getAttribute("component-url") || "<unknown>",
              componentExport = this.getAttribute("component-export");

            if (componentExport) {
              componentUrl += ` (export ${componentExport})`;
            }

            console.error(
              `[hydrate] Error parsing props for component ${componentUrl}`,
              this.getAttribute("props"),
              error
            );
            throw error;
          }

          // Perform hydration
          await this.hydrator(this)(this.Component, props, slotContent, {
            client: this.getAttribute("client"),
          });

          // Remove SSR attribute and dispatch hydration event
          this.removeAttribute("ssr");
          this.dispatchEvent(new CustomEvent("astro:hydrate"));
        });

        // Handler for when component is removed from DOM
        defineProp(this, "unmount", () => {
          if (!this.isConnected) {
            this.dispatchEvent(new CustomEvent("astro:unmount"));
          }
        });
      }

      // Clean up when element is removed
      disconnectedCallback() {
        document.removeEventListener("astro:after-swap", this.unmount);
        document.addEventListener("astro:after-swap", this.unmount, {
          once: true,
        });
      }

      // Initialize when element is added to DOM
      connectedCallback() {
        // If not waiting for children or document is already loaded
        if (
          !this.hasAttribute("await-children") ||
          document.readyState === "interactive" ||
          document.readyState === "complete"
        ) {
          this.childrenConnectedCallback();
        } else {
          // Set up observer to wait for all children to be added
          let onReady = () => {
            document.removeEventListener("DOMContentLoaded", onReady);
            observer.disconnect();
            this.childrenConnectedCallback();
          };

          let observer = new MutationObserver(() => {
            var lastChild;
            // Check if final comment node is present (marker for complete children)
            if (
              ((lastChild = this.lastChild) == null
                ? void 0
                : lastChild.nodeType) === Node.COMMENT_NODE &&
              this.lastChild.nodeValue === "astro:end"
            ) {
              this.lastChild.remove();
              onReady();
            }
          });

          observer.observe(this, { childList: true });
          document.addEventListener("DOMContentLoaded", onReady);
        }
      }

      // Initialize after children are connected
      async childrenConnectedCallback() {
        // Run before-hydration script if specified
        let beforeHydrationUrl = this.getAttribute("before-hydration-url");
        if (beforeHydrationUrl) {
          await import(beforeHydrationUrl);
        }
        this.start();
      }

      // Begin component loading and hydration
      async start() {
        let options = JSON.parse(this.getAttribute("opts")),
          clientName = this.getAttribute("client");

        // If client module not loaded yet, wait for it
        if (Astro[clientName] === undefined) {
          window.addEventListener(`astro:${clientName}`, () => this.start(), {
            once: true,
          });
          return;
        }

        // Begin hydration process
        try {
          await Astro[clientName](
            async () => {
              let componentUrl = this.getAttribute("component-url"),
                rendererUrl = this.getAttribute("renderer-url"),
                [componentModule, { default: rendererModule }] =
                  await Promise.all([
                    import(componentUrl),
                    rendererUrl ? import(rendererUrl) : () => () => {},
                  ]),
                exportName = this.getAttribute("component-export") || "default";

              // Get the component from the module
              if (!exportName.includes(".")) {
                this.Component = componentModule[exportName];
              } else {
                // Handle nested exports with dot notation
                this.Component = componentModule;
                for (let nestedProp of exportName.split(".")) {
                  this.Component = this.Component[nestedProp];
                }
              }

              this.hydrator = rendererModule;
              return this.hydrate;
            },
            options,
            this
          );
        } catch (error) {
          console.error(
            `[astro-island] Error hydrating ${this.getAttribute(
              "component-url"
            )}`,
            error
          );
        }
      }

      // Respond to props changes
      attributeChangedCallback() {
        this.hydrate();
      }
    }

    // Watch for props attribute changes
    defineProp(AstroIsland, "observedAttributes", ["props"]);

    // Register custom element if not already defined
    if (!customElements.get("astro-island")) {
      customElements.define("astro-island", AstroIsland);
    }
  }
})();
