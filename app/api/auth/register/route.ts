import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  rut: z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  email: z.string().email(),
  phone: z.string().regex(/^\+56\d{9}$/),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(data.password, 12);
    const verifyToken = crypto.randomUUID();

    await prisma.user.create({
      data: {
        name: data.name,
        company: data.company,
        rut: data.rut,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        verifyToken,
        emailVerified: null,
      },
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verificar-email?token=${verifyToken}`;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "IMC Cargo <noreply@imccargo.cl>",
        to: data.email,
        subject: "Verifica tu cuenta - IMC Cargo",
        html: `
          <h2>Bienvenido a IMC Cargo</h2>
          <p>Hola ${data.name},</p>
          <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#1B2A6B;color:white;text-decoration:none;border-radius:8px;">Verificar correo</a>
          <p>Si no creaste esta cuenta, ignora este correo.</p>
        `,
      });
    } else {
      console.log(`[DEV] Verification URL for ${data.email}: ${verifyUrl}`);
    }

    return NextResponse.json(
      { message: "Usuario registrado exitosamente." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos.", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
