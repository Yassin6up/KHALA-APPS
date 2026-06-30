import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';

const AI_RESPONSES: Record<string, string> = {
  هدف: 'تحديد الهدف الواضح هو أول خطوة للنجاح. حاول أن تكتب هدفك بصيغة SMART: محدد، قابل للقياس، قابل للتحقيق، ذو صلة، ومحدد بوقت. ما هو هدفك؟',
  وقت: 'إدارة الوقت من أهم المهارات في تطوير الذات. جرّب تقنية بومودورو: ٢٥ دقيقة تركيز ثم ٥ دقائق راحة. هل تريد خطة تنظيم يومية مخصصة لك؟',
  تحفيز: 'التحفيز يأتي من معرفة "لماذا". اسأل نفسك: لماذا تريد تحقيق هذا الهدف؟ ربط هدفك بقيمك الأعمق يجعل الاستمرار أسهل. 💪',
  اكتئاب: 'أفهم ما تمر به. من المهم أن تعرف أنك لست وحدك. تحدث مع شخص تثق به أو مختص. أنا هنا للدعم، لكن لا تتردد في طلب المساعدة المتخصصة. ❤️',
  قلق: 'القلق طبيعي، لكنه قابل للإدارة. جرّب تمرين التنفس العميق: شهيق ٤ ثوانٍ، حبس ٤ ثوانٍ، زفير ٤ ثوانٍ. كرر ٤ مرات. هل تشعر بتحسن؟',
  مهارة: 'تعلّم مهارة جديدة يحتاج ممارسة يومية منتظمة. ما المهارة التي تريد تطويرها؟ سأساعدك في وضع خطة تعلّم مناسبة.',
  قيادة: 'القيادة الحقيقية تبدأ من قيادة الذات أولاً. ركز على: الاتساق في القرارات، الاستماع الفعّال، والقدرة على التحفيز. هل تريد تمريناً يومياً لتطوير مهارات القيادة؟',
  ثقة: 'بناء الثقة بالنفس يبدأ بالإنجازات الصغيرة. ضع أهدافاً يومية صغيرة وحققها. كل إنجاز صغير يبني الثقة الكبيرة. ما هو أصغر إنجاز يمكنك تحقيقه اليوم؟',
};

const DEFAULT_RESPONSES = [
  'فهمت ما تقول. دعنا نعمل معاً على هذا الجانب خطوة بخطوة. هل تريد مني أن أقترح خطة مخصصة؟',
  'شكراً لمشاركتي أفكارك. هذا تفكير ناضج. ما الذي تريد تحقيقه على المدى القريب؟',
  'أقدّر صراحتك. التطوير الشخصي رحلة مستمرة. استمر في المضي قُدُماً وتذكّر أن كل خطوة صغيرة تهم. 🌱',
  'سؤال رائع! الخطوة الأولى دائماً هي الوضوح. حدد بدقة ما تريد تحسينه، وسأساعدك في التخطيط.',
  'أنت على المسار الصحيح! التوعية الذاتية أهم أدوات التطوير. استمر في هذا التفكير العميق.',
];

function getAiResponse(message: string): string {
  for (const [keyword, response] of Object.entries(AI_RESPONSES)) {
    if (message.includes(keyword)) return response;
  }
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
}

@ApiTags('mentor')
@ApiSecurity('app-key')
@ApiBearerAuth()
@UseGuards(AppContextGuard, JwtAuthGuard)
@Controller('mentor')
export class MentorController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tasks')
  async tasks(@AppId() appId: string, @CurrentUser() userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.dailyTask.findMany({
      where: {
        appId,
        userId,
        dueDate: { gte: today, lt: tomorrow },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  @Patch('tasks/:id')
  async updateTask(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.prisma.dailyTask.update({
      where: { id },
      data: {
        status: body.status,
        completedAt: body.status === 'done' ? new Date() : null,
      },
    });
  }

  @Get('plan')
  async plan(@AppId() appId: string, @CurrentUser() userId: string) {
    return this.prisma.devPlan.findFirst({
      where: { appId, userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('chat')
  async chat(
    @Body() body: { message: string },
  ) {
    const response = getAiResponse(body.message ?? '');
    return { response, ts: new Date().toISOString() };
  }
}
