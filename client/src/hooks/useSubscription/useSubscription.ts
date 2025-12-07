import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBillingPlans,
  getSubscriptionDetails,
  checkoutSubscription,
  updateSubscription,
  BillingPlan,
  SubscriptionDetails,
  SubscriptionHistoryEntry
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

interface UseSubscriptionReturn {
  plans: BillingPlan[];
  providers: CheckoutProvider[];
  subscription?: SubscriptionDetails;
  history: SubscriptionHistoryEntry[];
  isPlansLoading: boolean;
  isSubscriptionLoading: boolean;
  checkout: (payload: CheckoutPayload) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  switchToFree: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
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

  const invalidateUserState = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
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

  return {
    plans: plansQuery.data?.plans || [],
    providers: plansQuery.data?.providers || [],
    subscription: subscriptionQuery.data?.subscription,
    history: subscriptionQuery.data?.history || [],
    isPlansLoading: plansQuery.isLoading,
    isSubscriptionLoading: subscriptionQuery.isLoading,
    checkout,
    cancelSubscription,
    switchToFree,
    refetchSubscription: async () => {
      await subscriptionQuery.refetch();
    },
    isMutating: checkoutMutation.isPending || updateMutation.isPending
  };
};
