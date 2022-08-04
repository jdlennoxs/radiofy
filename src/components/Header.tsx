import { signIn, signOut, useSession } from "next-auth/react";

const Header = () => {
  const { data: session } = useSession();
  return (
    <div className="bg-zinc-800 flex flex-row-reverse p-2 h-16">
      {session ? (
        <div className="flex gap-4 items-center">
          <button className="text-zinc-100" onClick={() => signOut()}>
            Sign out
          </button>
          <img
            className="rounded-full w-10 h-10"
            src={session?.user?.image || ""}
            alt=""
          />
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          <button className="text-zinc-100" onClick={() => signIn()}>
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
