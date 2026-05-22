import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordEmail } from "@/lib/email/templates";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Correo requerido." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomUUID();
      const resetExpires = new Date(Date.now() + 86400000); // 24 hours

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpires },
      });

      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://webimcoficial.vercel.app';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      const tpl = resetPasswordEmail({ name: user.name, resetUrl });
      const result = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

      if (!result.sent) {
        console.log(`[FORGOT-PASSWORD · ${result.mode}] for ${email}: ${resetUrl}`);
      }
    }

    // Always return 200 to not leak whether the email exists
    return NextResponse.json({
      message: "Si existe una cuenta con ese correo, recibirás un enlace.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
