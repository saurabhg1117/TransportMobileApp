import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  DriverManagement: undefined;
  CompanySettings: undefined;
  SlipList: undefined;
  CreateSlip: { slipId?: string } | undefined;
  SlipDetail: { slipId: string };
  Profile: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
