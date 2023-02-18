import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.url!.replace("/api/", "");
  const files = fs.readdirSync(path.resolve() + "/public/");
  const matchingFile = files.find((e) => e.includes(query));
  if (matchingFile) {
    const body = fs.readFileSync(path.resolve() + `/public/${matchingFile}`);
    res.status(StatusCodes.OK).json(JSON.parse(body));
  } else res.status(StatusCodes.NOT_FOUND).send({ message: "not found" });
}
