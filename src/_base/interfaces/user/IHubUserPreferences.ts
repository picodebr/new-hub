export interface IHubUserPreferences {
  theme: 'dark' | 'light';
  custom_avatar?: Record<string, string>;
  use_custom_avatar?: boolean;
}
