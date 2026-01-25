import { Button } from "@/components/ui/button";

export function ApprovalActions(props: { restaurantId: string; canApprove?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={`/admin/restaurants/${props.restaurantId}/approve`} method="post">
        <Button type="submit" disabled={props.canApprove === false}>
          Approve &amp; Activate
        </Button>
      </form>

      <form action={`/admin/restaurants/${props.restaurantId}/send-welcome`} method="post">
        <Button type="submit" variant="secondary">
          Send Welcome Email
        </Button>
      </form>

      <form action={`/admin/restaurants/${props.restaurantId}/delete`} method="post">
        <Button type="submit" variant="destructive">
          Delete
        </Button>
      </form>
    </div>
  );
}

