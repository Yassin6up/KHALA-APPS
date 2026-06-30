const BADGE_IMAGES: Record<string, any> = {
  first_step:       require('../../assets/images/badge_first_step.png'),
  streak_7:         require('../../assets/images/badge_streak.png'),
  streak_30:        require('../../assets/images/badge_streak_30.png'),
  library_5:        require('../../assets/images/badge_reader.png'),
  community_active: require('../../assets/images/badge_community.png'),
  tasks_10:         require('../../assets/images/badge_tasks_10.png'),
  assessment_done:  require('../../assets/images/badge_assessment.png'),
  plan_complete:    require('../../assets/images/badge_plan.png'),
};

export function getBadgeImage(code: string): any | null {
  return BADGE_IMAGES[code] ?? null;
}
