"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(_: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      pin: formData.get("pin"),
      rfid: formData.get("rfid"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Nieprawidłowy PIN lub RFID.";
    }

    throw error;
  }
}
