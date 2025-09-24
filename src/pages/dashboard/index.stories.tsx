import type { Meta, StoryObj } from "@storybook/react";
import { within } from "@testing-library/dom";
import { rest } from "msw";
import Dashboard from "./index";

const meta: Meta<typeof Dashboard> = {
  title: "Pages/Dashboard (Play)",
  component: Dashboard,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

// Populated state: MSW returns some plants for the real component to render
export const Populated: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get("/api/plants/:userId", (req, res, ctx) => {
          return res(
            ctx.json({
              data: [
                { id: "1", name: "Tomato", varietyName: "Cherry Tomato" },
                { id: "2", name: "Basil", varietyName: "Sweet Basil" },
              ],
            })
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId("smartgarden-title");
    await canvas.findByText(/Welcome,/i);
    // plants are rendered inside PlantGarden; assert that one of the variety names appears
    await canvas.findByText(/Tomato|Basil/i);
  },
};

// Empty state: no plants
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get("/api/plants/:userId", (req, res, ctx) => {
          return res(ctx.json({ data: [] }));
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/No plant groups found/i);
  },
};

// Loading state: slow response to show loader
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        rest.get("/api/plants/:userId", async (req, res, ctx) => {
          await new Promise((r) => setTimeout(r, 1200));
          return res(ctx.json({ data: [] }));
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Loading UI is shown while the request is pending
    await canvas.findByText(/Loading dashboard.../i);
  },
};
