import errorToast from "@helpers/errorToast";
import { MONTHLY_PRO_PRICE, PRO_EOA_ADDRESS } from "@hey/data/constants";
import { Errors } from "@hey/data/errors";
import addMonthsToDate from "@hey/helpers/datetime/addMonthsToDate";
import formatDate from "@hey/helpers/datetime/formatDate";
import { Button, Modal, RangeSlider } from "@hey/ui";
import plur from "plur";
import type { FC } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useHandleWrongNetwork from "src/hooks/useHandleWrongNetwork";
import { useProStore } from "src/store/non-persisted/useProStore";
import { useProfileStore } from "src/store/persisted/useProfileStore";
import { parseEther } from "viem";
import { useSendTransaction, useTransactionReceipt } from "wagmi";

interface ExtendButtonProps {
  size?: "lg" | "md";
}

const ExtendButton: FC<ExtendButtonProps> = ({ size = "lg" }) => {
  const { currentProfile } = useProfileStore();
  const { isPro, proExpiresAt } = useProStore();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [months, setMonths] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );

  const handleWrongNetwork = useHandleWrongNetwork();
  const { sendTransactionAsync } = useSendTransaction({
    mutation: {
      onError: errorToast,
      onSuccess: (hash: string) => setTransactionHash(hash as `0x${string}`)
    }
  });

  const { isFetching: transactionLoading, isSuccess } = useTransactionReceipt({
    hash: transactionHash as `0x${string}`,
    query: { enabled: Boolean(transactionHash) }
  });

  useEffect(() => {
    if (isSuccess) {
      location.reload();
    }
  }, [isSuccess]);

  const handleUpgrade = async () => {
    if (!currentProfile) {
      return toast.error(Errors.SignWallet);
    }

    try {
      setIsLoading(true);
      await handleWrongNetwork();
      await sendTransactionAsync({
        data: currentProfile.id,
        to: PRO_EOA_ADDRESS,
        value: parseEther((MONTHLY_PRO_PRICE * months).toString())
      });
      setShowUpgradeModal(false);
    } catch (error) {
      errorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="mt-3 w-full"
        onClick={() => setShowUpgradeModal(true)}
        size={size}
        disabled={isLoading || transactionLoading}
      >
        {transactionLoading
          ? "Transaction pending..."
          : isPro
            ? "Extend Pro"
            : "Upgrade to Pro"}
      </Button>
      <Modal
        onClose={() => setShowUpgradeModal(false)}
        show={showUpgradeModal}
        title={isPro ? "Extend" : "Upgrade"}
      >
        <div className="m-5 space-y-5">
          <div className="space-y-2">
            <div>
              {isPro ? "Extend your" : "Upgrade to"} Pro subscription for{" "}
              <b>
                {months} {plur("month", months)}
              </b>
            </div>
            <div className="ld-text-gray-500 text-sm">
              This is a non-refundable subscription. You will be charged
              immediately for the duration of the subscription.
            </div>
            {proExpiresAt && (
              <div className="text-sm">
                New expiration date:{" "}
                <b>
                  {formatDate(addMonthsToDate(proExpiresAt, months) as any)}
                </b>
              </div>
            )}
            <div className="text-sm">
              Price: <b>{MONTHLY_PRO_PRICE * months} POL (MATIC)</b>
            </div>
          </div>
          <RangeSlider
            displayValue={months.toString()}
            defaultValue={[months]}
            showValueInThumb
            max={50}
            min={1}
            onValueChange={(value) => setMonths(value[0])}
          />
          <Button
            className="w-full"
            onClick={handleUpgrade}
            disabled={isLoading || transactionLoading}
          >
            {transactionLoading
              ? "Transaction pending..."
              : isPro
                ? "Extend Pro"
                : "Upgrade to Pro"}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ExtendButton;
