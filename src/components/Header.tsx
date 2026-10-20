import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

const Header = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 left-4 z-50">
      {session ? (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="focus:outline-none block"
            title={session?.user?.name || "User menu"}
          >
            <img
              className="rounded-full w-10 h-10 border-2 border-transparent hover:border-zinc-400 transition-colors shadow-lg"
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
            />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              ></div>
              <div className="absolute left-0 mt-2 w-48 bg-zinc-900 rounded-md shadow-xl py-1 z-20 border border-zinc-700">
                <div className="px-4 py-2 text-sm text-zinc-400 border-b border-zinc-800 font-medium">
                  {session?.user?.name}
                </div>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Header;
