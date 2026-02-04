import { FireIcon as FireOutline } from "@heroicons/react/24/outline";
import { FireIcon as FireFilled } from "@heroicons/react/24/solid";
import { useState } from "react";

const FireButton = () => {
  const [isFire, setIsFire] = useState(false);
  const toggleSaved = () => {
    setIsFire(!isFire);
  };

  return (
    <button
      className="flex text-amber-900 p-4 rounded-full ml-4"
      onClick={toggleSaved}
    >
      {isFire ? (
        <span className="flex items-center text-amber-600">
          <FireFilled className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : (
        <span className="flex items-center text-amber-600">
          <FireOutline className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
    </button>
  );
};

export default FireButton;
