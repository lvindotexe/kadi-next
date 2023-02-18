import { promises as fs } from "fs";
import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.url!.replace("/api/", "");
  const files = await fs.readdir(path.resolve() + "/public/");
  const matchingFile = files.find((e) => e.includes(query));
  if (matchingFile) {
    const body = await fs.readFile(
      path.resolve() + `/public/${matchingFile}`,
      "utf-8"
    );
    res.status(StatusCodes.OK).json(JSON.parse(body));
  } else res.status(StatusCodes.NOT_FOUND).send({ message: "not found" });
}
