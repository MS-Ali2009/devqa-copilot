import { InputType, OutputMode, PlatformType, EnvironmentType, OutputLanguage } from './copilot';

export interface HistoryItemV1 {
  id: string;
  version: 1;
  createdAt: string;
  title: string;
  rawInput: string;
  inputType: InputType;
  outputMode: OutputMode;
  projectContext?: string;
  platform?: PlatformType;
  techStack?: string;
  targetEnvironment?: EnvironmentType;
  outputLanguage: OutputLanguage;
  markdownOutput: string;
}

export interface LocalHistoryStorageV1 {
  version: 1;
  items: HistoryItemV1[];
  lastUpdated: string;
}
