import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBillingPlans,
  getSubscriptionDetails,
  checkoutSubscription,
  updateSubscription,
  getUserLimits,
  BillingPlan,
  SubscriptionDetails,
  SubscriptionHistoryEntry,
  TierLimits,
  UserLimitsResponse
} from '../../api';
import { PlanTier, CheckoutProvider } from '../../types/user';

interface UseSubscriptionOptions {
  enabled?: boolean;
}

interface CheckoutPayload {
  planTier: PlanTier;
  provider?: CheckoutProvider;
  paymentMethod?: string;
  paymentReference?: string;
}

interface UsageInfo {
  totalBots: number;
  runningBots: number;
  canCreateBot: boolean;
  canRunBot: boolean;
  botsRemaining: number;
  runningBotsRemaining: number;
}

interface UseSubscriptionReturn {
  plans: BillingPlan[];
  providers: CheckoutProvider[];
  subscription?: SubscriptionDetails;
  history: SubscriptionHistoryEntry[];
  limits?: TierLimits;
  usage?: UsageInfo;
  isPlansLoading: boolean;
  isSubscriptionLoading: boolean;
  isLimitsLoading: boolean;
  checkout: (payload: CheckoutPayload) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  switchToFree: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
  refetchLimits: () => Promise<void>;
  isMutating: boolean;
}

export const useSubscription = (options: UseSubscriptionOptions = {}): UseSubscriptionReturn => {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['billingPlans'],
    queryFn: async () => {
      const response = await getBillingPlans();
      return response.data;
    }
  });

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await getSubscriptionDetails();
      return response.data;
    },
    enabled: options.enabled !== undefined ? options.enabled : true
  });

  const limitsQuery = useQuery({
    queryKey: ['userLimits'],
    queryFn: async () => {
      const response = await getUserLimits();
      return response.data;
    },
    enabled: options.enabled !== undefined ? options.enabled : true,
    staleTime: 30000, // 30 seconds
  });

  const invalidateUserState = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['userLimits'] });
  };

  const checkoutMutation = useMutation({
    mutationFn: checkoutSubscription,
    onSuccess: () => invalidateUserState()
  });

  const updateMutation = useMutation({
    mutationFn: updateSubscription,
    onSuccess: () => invalidateUserState()
  });

  const checkout = async (payload: CheckoutPayload) => {
    await checkoutMutation.mutateAsync(payload);
  };

  const cancelSubscription = async () => {
    await updateMutation.mutateAsync({ action: 'CANCEL' });
  };

  const switchToFree = async () => {
    await updateMutation.mutateAsync({ action: 'SWITCH', planTier: 'FREE' });
  };

  // Extract usage info from limits response
  const usage: UsageInfo | undefined = limitsQuery.data ? {
    totalBots: limitsQuery.data.usage.totalBots,
    runningBots: limitsQuery.data.usage.runningBots,
    canCreateBot: limitsQuery.data.canCreateBot,
    canRunBot: limitsQuery.data.canRunBot,
    botsRemaining: limitsQuery.data.botsRemaining,
    runningBotsRemaining: limitsQuery.data.runningBotsRemaining
  } : undefined;

  return {
    plans: plansQuery.data?.plans || [],
    providers: plansQuery.data?.providers || [],
    subscription: subscriptionQuery.data?.subscription,
    history: subscriptionQuery.data?.history || [],
    limits: limitsQuery.data?.limits || subscriptionQuery.data?.subscription?.limits,
    usage,
    isPlansLoading: plansQuery.isLoading,
    isSubscriptionLoading: subscriptionQuery.isLoading,
    isLimitsLoading: limitsQuery.isLoading,
    checkout,
    cancelSubscription,
    switchToFree,
    refetchSubscription: async () => {
      await subscriptionQuery.refetch();
    },
    refetchLimits: async () => {
      await limitsQuery.refetch();
    },
    isMutating: checkoutMutation.isPending || updateMutation.isPending
  };
};
