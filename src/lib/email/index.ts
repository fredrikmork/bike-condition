import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Bike Condition <noreply@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function kmLeft(currentDistance: number, recommendedDistance: number): number {
  return Math.max(0, Math.round(recommendedDistance - currentDistance));
}

export async function sendWarnEmail(options: {
  to: string;
  componentName: string;
  bikeName: string;
  currentDistance: number;
  recommendedDistance: number;
  wearPct: number;
}): Promise<void> {
  const { to, componentName, bikeName, currentDistance, recommendedDistance, wearPct } = options;
  const remaining = kmLeft(currentDistance, recommendedDistance);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${componentName} nærmer seg utskiftningstid — ${bikeName}`,
    html: `
<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; color: #111; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-top: 0;">🔧 Komponenten nærmer seg utskiftningstid</h2>
  <p>
    <strong>${componentName}</strong> på <strong>${bikeName}</strong> har nådd
    <strong>${wearPct} %</strong> av anbefalt utskiftningsavstand.
  </p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr>
      <td style="padding: 8px 0; color: #555;">Kjørt distanse</td>
      <td style="padding: 8px 0; text-align: right;"><strong>${Math.round(currentDistance).toLocaleString("nb-NO")} km</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">Anbefalt grense</td>
      <td style="padding: 8px 0; text-align: right;"><strong>${recommendedDistance.toLocaleString("nb-NO")} km</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">Gjenstår</td>
      <td style="padding: 8px 0; text-align: right; color: #d97706;"><strong>~${remaining.toLocaleString("nb-NO")} km</strong></td>
    </tr>
  </table>
  <a href="${APP_URL}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 8px;">Åpne Bike Condition</a>
  <p style="margin-top: 32px; font-size: 12px; color: #999;">
    Du mottar dette fordi du har aktivert e-postvarsler i Bike Condition.
  </p>
</body>
</html>`,
  });
}

export async function sendCriticalEmail(options: {
  to: string;
  componentName: string;
  bikeName: string;
  currentDistance: number;
  recommendedDistance: number;
  wearPct: number;
}): Promise<void> {
  const { to, componentName, bikeName, currentDistance, recommendedDistance, wearPct } = options;
  const overBy = Math.round(currentDistance - recommendedDistance);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚠️ ${componentName} bør skiftes nå — ${bikeName}`,
    html: `
<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; color: #111; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-top: 0; color: #dc2626;">⚠️ Komponent har overskredet anbefalt grense</h2>
  <p>
    <strong>${componentName}</strong> på <strong>${bikeName}</strong> har nådd
    <strong>${wearPct} %</strong> av anbefalt utskiftningsavstand og bør skiftes snarest.
  </p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr>
      <td style="padding: 8px 0; color: #555;">Kjørt distanse</td>
      <td style="padding: 8px 0; text-align: right;"><strong>${Math.round(currentDistance).toLocaleString("nb-NO")} km</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">Anbefalt grense</td>
      <td style="padding: 8px 0; text-align: right;"><strong>${recommendedDistance.toLocaleString("nb-NO")} km</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">Over grensen med</td>
      <td style="padding: 8px 0; text-align: right; color: #dc2626;"><strong>${overBy.toLocaleString("nb-NO")} km</strong></td>
    </tr>
  </table>
  <a href="${APP_URL}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 8px;">Registrer utskiftning</a>
  <p style="margin-top: 32px; font-size: 12px; color: #999;">
    Du mottar dette fordi du har aktivert e-postvarsler i Bike Condition.
  </p>
</body>
</html>`,
  });
}
