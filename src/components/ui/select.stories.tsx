import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectLabel,
  SelectSeparator,
} from './select'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent>
        <SelectLabel>Options</SelectLabel>
        <SelectItem value="one">One</SelectItem>
        <SelectSeparator />
        <SelectItem value="two">Two</SelectItem>
      </SelectContent>
    </Select>
  ),
}
