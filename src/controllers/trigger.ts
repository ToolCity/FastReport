import { Request, Response } from "express";
import { baselineStore, configStore } from "../store/index.js";
import {
  getScore,
  defaultCategory,
  setUpLighthouseQueryString,
} from "../services/pagespeed.js";
import { PSICategories } from "../types/index.js";
import { compareReportWithBaseline } from "../services/baseline.js";
import { sendAlertMail } from "../services/alert.js";

export const getTrigger = async (req: Request, res: Response) => {
  const { apiKey, category } = req.query;
  if (!apiKey) {
    res.status(400).json({ error: "apiKey is required" });
    return;
  }
  const config = configStore.find((config) => config.id === apiKey.toString());
  if (!config) {
    res.status(404).json({ error: "config not found" });
    return;
  }
  // access the categories requested by user
  let chosenCategory: PSICategories[] = defaultCategory;
  if (category) {
    if (typeof category === "string") {
      // @ts-ignore
      chosenCategory = category.split(",").filter((c: string) => {
        const psic = c.trim().toLocaleLowerCase();
        if (Object.values(PSICategories).includes(psic as PSICategories)) {
          return psic;
        }
      });
      if (chosenCategory?.length === 0) {
        res.status(400).json({
          error: `category should be a string separated by , and can accept only ${Object.values(
            PSICategories
          ).join(", ")}`,
        });
        return;
      }
    } else {
      res.status(400).json({
        error: `category should be a string separated by , and can accept only ${Object.values(
          PSICategories
        ).join(", ")}`,
      });
      return;
    }
  }
  const { urls } = config;

  const queries = urls.map((url) =>
    setUpLighthouseQueryString(url, chosenCategory)
  );
  // trigger the queries
  const data = await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const response = await (await fetch(query)).json();
        if (response.error) {
          throw new Error(response.error.message);
        }
        const { lighthouseResult } = response;
        return getScore(lighthouseResult);
      } catch (e) {
        throw e;
      }
    })
  );
  const report = data.map((result, index) => {
    const url = urls[index];
    if (result.status === "fulfilled") {
      const score = result.value;
      return { url, ...score };
    } else {
      return { url, error: result.reason.message, failed: true };
    }
  });
  const result = compareReportWithBaseline(
    report,
    apiKey.toString(),
    chosenCategory
  );
  const alertStatus = await sendAlertMail(apiKey.toString(), result);
  res.json({ result, report, alertStatus });
};
