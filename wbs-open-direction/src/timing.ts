// Film timeline in seconds. Measured from the supplied recording
// (energy pauses + prefix-scan transcription), shifted by VO_OFFSET.
export const FPS = 30;
export const DURATION = 28.0;
export const VO_OFFSET = 0.4;

// Music grid: 117.65 BPM, so downbeats land on «لصحتك» (2.70) and «صحتك ليها مكان» (23.10).
export const BEAT = 0.51;
export const BAR = BEAT * 4;
export const HALF = BEAT / 2;
export const DOWNBEAT0 = 2.7;

const o = (s: number) => s + VO_OFFSET;
export const T = {
  wasat: o(0.29), // وسط يوم الشغل…
  khod: o(1.8), // خُد
  waqt: o(2.05), // وقت
  sehetak: o(2.3), // لصحتك
  mobadra: o(3.57), // مبادرة
  wa2fetak: o(4.05), // وقفتك
  besehetak: o(4.55), // بصحتك
  fi: o(5.4), // في
  breadfast: o(5.5), // Breadfast
  bed3am: o(5.98), // بدعم من
  ivein: o(6.33), // آيفين
  etnein: o(7.13), // الاتنين
  t19: o(7.8), // تسعتاشر
  october: o(8.42), // أكتوبر
  nefham: o(9.56), // نفهم
  dawaly: o(10.4), // الدوالي
  wiqaya: o(11.55), // الوقاية
  nraja3: o(12.41), // نراجع
  adatna: o(12.95), // عاداتنا
  shoghl: o(13.4), // أثناء الشغل
  nekhtar: o(14.16), // نختار
  akl: o(14.6), // أكل
  yomna: o(15.1), // يناسب يومنا
  ma3: o(16.1), // ومع
  baheya: o(16.5), // بهية
  hanetkalem: o(17.1), // هنتكلم
  saratan: o(17.85), // سرطان الثدي
  ahamya: o(18.7), // وأهمية
  kashf: o(19.3), // الكشف المبكر
  wasat2: o(20.73), // وسط كل اللي
  matloub: o(21.6), // مطلوب منك
  sehetak2: o(22.71), // صحتك
  makan: o(23.35), // ليها مكان
  mestanyeen: o(24.15), // مستنيينكم
};
