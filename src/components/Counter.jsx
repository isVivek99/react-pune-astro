import React, { useState } from "react";

const Counter = () => {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-100 shadow-sm max-w-md mx-auto my-8">
      <h2 className="text-xl font-medium tracking-tight mb-6 text-gray-900">
        Counter {Math.floor(Math.random() * 100)}
      </h2>
      <div className="w-full p-4 mb-6 bg-gray-50 rounded-md border border-gray-100">
        <p className="text-center text-3xl font-medium text-gray-900">
          {count}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={decrement}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          -
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Reset
        </button>
        <button
          onClick={increment}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;
