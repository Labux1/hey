import { getAuthApiHeaders } from "@helpers/getAuthApiHeaders";
import { ChatBubbleLeftIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { HEY_API_URL } from "@hey/data/constants";
import { FeatureFlag } from "@hey/data/feature-flags";
import type { MirrorablePublication } from "@hey/lens";
import { Button } from "@hey/ui";
import { useFlag } from "@unleash/proxy-client-react";
import axios from "axios";
import type { FC } from "react";
import { toast } from "react-hot-toast";

interface SuspendButtonsProps {
  onClick?: () => void;
  publication: MirrorablePublication;
}

const SuspendButtons: FC<SuspendButtonsProps> = ({ onClick, publication }) => {
  const isStaff = useFlag(FeatureFlag.Staff);

  if (!isStaff) {
    return null;
  }

  const updateFeatureFlag = (id: string) => {
    onClick?.();
    toast.promise(
      axios.post(
        `${HEY_API_URL}/internal/permissions/assign`,
        { enabled: true, id, profile_id: publication.by.id },
        { headers: getAuthApiHeaders() }
      ),
      {
        error: "Error suspending profile",
        loading: "Suspending profile...",
        success: "Profile suspended"
      }
    );
  };

  return (
    <>
      <Button
        className="flex justify-center"
        icon={<NoSymbolIcon className="size-4" />}
        onClick={() =>
          updateFeatureFlag("8ed8b26a-279d-4111-9d39-a40164b273a0")
        }
        size="sm"
        variant="danger"
      >
        Profile Suspend
      </Button>
      <Button
        className="flex justify-center"
        icon={<ChatBubbleLeftIcon className="size-4" />}
        onClick={() =>
          updateFeatureFlag("df931ea4-109f-4fde-a8b5-4b2170730e8c")
        }
        size="sm"
        variant="danger"
      >
        Comment Suspend
      </Button>
    </>
  );
};

export default SuspendButtons;
