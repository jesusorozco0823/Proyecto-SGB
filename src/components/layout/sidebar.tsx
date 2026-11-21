import SidebarContent from './sidebar-content';

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r bg-card md:block">
      <SidebarContent />
    </aside>
  );
}
