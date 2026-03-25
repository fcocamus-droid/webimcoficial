import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido o ya utilizado." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verifyToken: null,
      },
    });

    return NextResponse.json({ message: "Correo verificado exitosamente." });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
