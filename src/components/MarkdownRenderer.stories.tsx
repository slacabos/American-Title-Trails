import type { Meta, StoryObj } from "@storybook/react-vite";
import MarkdownRenderer from "./MarkdownRenderer";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "Game/MarkdownRenderer",
  component: MarkdownRenderer,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof MarkdownRenderer>;

export const AllElements: Story = {
  args: {
    content: `# Heading 1

## Heading 2

### Heading 3

This is a paragraph with **bold text**, *italic text*, and \`inline code\`.

- First item
- Second item
- Third item

1. Step one
2. Step two
3. Step three

> This is a blockquote with some important information.

---

Here is another paragraph after a horizontal rule.`,
  },
};

export const Headings: Story = {
  args: {
    content: `# Main Title

## Section Heading

### Subsection Heading

Each heading level has distinct styling with different colors and sizes.`,
  },
};

export const CodeAndQuotes: Story = {
  args: {
    content: `Use \`inline code\` for short snippets.

> Blockquotes highlight important notes or callouts.

> Another blockquote with **bold** emphasis inside.

Combine \`code\` with regular text freely.`,
  },
};
