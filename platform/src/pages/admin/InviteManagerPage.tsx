import { InviteManager } from "../../components/invites/InviteManager";

export default function InviteManagerPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Invite Manager</h1>
      <InviteManager scope="all" />
    </div>
  );
}
