import { Sidebar, SidebarProvider, SidebarTrigger } from './ui/sidebar-chat'

export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return <Sidebar {...props}>CHAT APP</Sidebar>
}
