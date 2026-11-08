import { StreamSourceType } from '../../types';

export interface SourceModePanelProps {
  sourceType: StreamSourceType;
  onChangeSourceType: (type: StreamSourceType) => void;
  sourceUrl: string;
  onChangeSourceUrl: (url: string) => void;
  requiresAuth: boolean;
  onToggleAuth: (val: boolean) => void;
  username: string;
  onChangeUsername: (val: string) => void;
  password: string;
  onChangePassword: (val: string) => void;
  streamKey: string;
  serverHost: string;
}

