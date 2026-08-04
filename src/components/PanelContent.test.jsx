import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PanelContent from "./PanelContent";

describe("PanelContent", () => {
  it("keeps children mounted and collapses the row height when closed", () => {
    render(
      <PanelContent open={false}>
        <div>panel body</div>
      </PanelContent>,
    );
    expect(screen.getByText("panel body")).toBeInTheDocument();
    expect(document.querySelector(".grid-rows-\\[0fr\\]")).toBeInTheDocument();
  });

  it("expands the row height when open", () => {
    render(
      <PanelContent open={true}>
        <div>panel body</div>
      </PanelContent>,
    );
    expect(document.querySelector(".grid-rows-\\[1fr\\]")).toBeInTheDocument();
  });
});
