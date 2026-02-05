import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Home from "../pages/index";

const mockUseSession = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn(), query: {} }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("../utils/trpc", () => ({
  trpc: {
    dashboard: {
      getOwned: {
        useQuery: () => ({
          data: [
            {
              id: "station-1",
              name: "Mock Station",
              playbackContext: {
                isPlaying: true,
                track: {
                  albumImage: "https://example.com/album.jpg",
                  name: "Mock Track",
                  artists: "Mock Artist",
                },
              },
            },
          ],
        }),
      },
    },
    spotify: {
      getDevices: {
        useQuery: () => ({
          data: { body: { devices: [] } },
        }),
      },
    },
  },
}));

describe("Home page", () => {
  it("shows sign-in prompt when logged out", () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<Home />);

    expect(screen.getByText(/Not signed in/i)).toBeInTheDocument();
  });

  it("renders stations when logged in", () => {
    mockUseSession.mockReturnValue({ data: { user: { name: "Sam" } } });

    render(<Home />);

    expect(screen.getByText("Mock Station")).toBeInTheDocument();
    expect(screen.getByText("Mock Track")).toBeInTheDocument();
  });
});
