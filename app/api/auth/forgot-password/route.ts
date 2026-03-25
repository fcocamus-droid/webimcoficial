import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetExpires },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "IMC Cargo <noreply@imccargo.cl>",
          to: email,
          subject: "Restablecer contraseña - IMC Cargo",
          html: `
            <h2>Restablecer contraseña</h2>
            <p>Hola ${user.name},</p>
            <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#1B2A6B;color:white;text-decoration:none;border-radius:8px;">Restablecer contraseña</a>
            <p>Este enlace expira en 1 hora.</p>
            <p>Si no solicitaste esto, ignora este correo.</p>
          `,
        });
      } else {
        console.log(`[DEV] Reset URL for ${email}: ${resetUrl}`);
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
