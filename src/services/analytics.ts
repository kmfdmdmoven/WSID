export type AnalyticsEvent =
  | 'app_opened'
  | 'language_selected'
  | 'auth_guest_completed'
  | 'registration_gate_shown'
  | 'registration_completed'
  | 'account_deleted'
  | 'registration_screen_opened'
  | 'auth_guest_failed'
  | 'question_screen_opened'
  | 'options_screen_opened'
  | 'reveal_started'
  | 'reveal_completed'
  | 'result_shown'
  | 'emotion_selected'
  | 'alternative_option_revealed'
  | 'insight_shown'
  | 'alternative_option_shown'
  | 'alternative_option_confirmed'
  | 'final_reflection_shown'
  | 'ad_placeholder_shown'
  | 'action_hub_opened'
  | 'try_another_clicked'
  | 'app_hub_opened'
  | 'history_opened'
  | 'early_access_submitted'
  | 'share_clicked'
  | 'rate_app_clicked';

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (props) {
    console.log(`[analytics] ${event}`, props);
  } else {
    console.log(`[analytics] ${event}`);
  }
}
