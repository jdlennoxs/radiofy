import { SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { trpc } from "../utils/trpc";

const Search = () => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 50);
  const { data: search } = trpc.useQuery(["spotify.search", query]);

  //   useEffect(
  //     () => {
  //       search(query);
  //     },
  //     [debouncedQuery, search, query] // Only call effect if debounced search term changes
  //   );

  return (
    <div className="flex items-center space-x-3 pl-3 md:p-3">
      <input
        className="w-20 md:w-24 accent-amber-200"
        type="text"
        // onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};

export default Search;
