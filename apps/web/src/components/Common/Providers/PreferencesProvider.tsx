import { getAuthApiHeaders } from "@helpers/getAuthApiHeaders";
import getCurrentSession from "@helpers/getCurrentSession";
import { HEY_API_URL } from "@hey/data/constants";
import { Permission } from "@hey/data/permissions";
import getAllTokens from "@hey/helpers/api/getAllTokens";
import getPreferences from "@hey/helpers/api/getPreferences";
import type { FiatRate } from "@hey/types/lens";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/router";
import { type FC, useEffect } from "react";
import { usePreferencesStore } from "src/store/non-persisted/usePreferencesStore";
import { useProfileStatus } from "src/store/non-persisted/useProfileStatus";
import { useProfileThemeStore } from "src/store/non-persisted/useProfileThemeStore";
import { useAllowedTokensStore } from "src/store/persisted/useAllowedTokensStore";
import { useRatesStore } from "src/store/persisted/useRatesStore";
import { useVerifiedMembersStore } from "src/store/persisted/useVerifiedMembersStore";

const PreferencesProvider: FC = () => {
  const { pathname } = useRouter();
  const { id: sessionProfileId } = getCurrentSession();
  const { setTheme } = useProfileThemeStore();
  const { setVerifiedMembers } = useVerifiedMembersStore();
  const { setAllowedTokens } = useAllowedTokensStore();
  const { setFiatRates } = useRatesStore();
  const {
    setAppIcon,
    setEmail,
    setEmailVerified,
    setHasDismissedOrMintedMembershipNft,
    setHighSignalNotificationFilter,
    setLoading
  } = usePreferencesStore();
  const { setStatus } = useProfileStatus();

  useEffect(() => {
    setTheme(null);
  }, [pathname]);

  const getPreferencesData = async () => {
    setLoading(true);
    const preferences = await getPreferences(getAuthApiHeaders());

    setHighSignalNotificationFilter(preferences.highSignalNotificationFilter);
    setAppIcon(preferences.appIcon);
    setEmail(preferences.email);
    setEmailVerified(preferences.emailVerified);
    setStatus({
      isCommentSuspended: preferences.permissions.includes(
        Permission.CommentSuspended
      ),
      isSuspended: preferences.permissions.includes(Permission.Suspended)
    });
    setHasDismissedOrMintedMembershipNft(
      preferences.hasDismissedOrMintedMembershipNft
    );
    setLoading(false);

    return true;
  };

  const getVerifiedMembersData = async () => {
    try {
      const response = await axios.get(`${HEY_API_URL}/misc/verified`);
      setVerifiedMembers(response.data.result || []);
      return true;
    } catch {
      return false;
    }
  };

  const getAllowedTokensData = async () => {
    const tokens = await getAllTokens();
    setAllowedTokens(tokens);
    return tokens;
  };

  const getFiatRatesData = async (): Promise<FiatRate[]> => {
    try {
      const response = await axios.get(`${HEY_API_URL}/lens/rate`);
      return response.data.result || [];
    } catch {
      return [];
    }
  };

  useQuery({
    enabled: Boolean(sessionProfileId),
    queryFn: getPreferencesData,
    queryKey: ["getPreferences", sessionProfileId || ""]
  });
  useQuery({
    queryFn: getVerifiedMembersData,
    queryKey: ["getVerifiedMembers"]
  });
  useQuery({
    queryFn: getAllowedTokensData,
    queryKey: ["getAllowedTokens"]
  });
  useQuery({
    queryFn: () =>
      getFiatRatesData().then((rates) => {
        setFiatRates(rates);
        return rates;
      }),
    queryKey: ["getFiatRates"]
  });

  return null;
};

export default PreferencesProvider;
