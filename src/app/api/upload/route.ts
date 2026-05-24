import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const data = await request.formData();

    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return Response.json(
        {
          message: "File tidak ditemukan",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name.replaceAll(" ", "-")}`;

    const uploadPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      fileName
    );

    await writeFile(uploadPath, buffer);

    return Response.json({
      message: "Upload berhasil",
      imageUrl: `/uploads/${fileName}`,
    });
  } catch (error) {
    return Response.json(
      {
        message: "Upload gagal",
        error,
      },
      { status: 500 }
    );
  }
}