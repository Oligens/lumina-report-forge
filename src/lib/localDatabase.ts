import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ReportItem, ReportSession } from "@/types/report";

interface ScarWriteDB extends DBSchema {
  sessions: { key: string; value: ReportSession };
  items: { key: string; value: ReportItem; indexes: { "by-report": string } };
}

let dbPromise: Promise<IDBPDatabase<ScarWriteDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScarWriteDB>("ScarWriteRapportDB", 1, {
      upgrade(db) {
        db.createObjectStore("sessions", { keyPath: "id" });
        const itemStore = db.createObjectStore("items", { keyPath: "id" });
        itemStore.createIndex("by-report", "report_id");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: ReportSession) {
  const db = await getDB();
  await db.put("sessions", session);
}

export async function listSessions(): Promise<ReportSession[]> {
  const db = await getDB();
  const all = await db.getAll("sessions");
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function deleteSession(id: string) {
  const db = await getDB();
  const items = await db.getAllFromIndex("items", "by-report", id);
  const tx = db.transaction(["items", "sessions"], "readwrite");
  for (const item of items) await tx.objectStore("items").delete(item.id);
  await tx.objectStore("sessions").delete(id);
  await tx.done;
}

/** Append new rows — never erases existing rows of the session. */
export async function addReportItems(reportId: string, newItems: ReportItem[]) {
  const db = await getDB();
  const tx = db.transaction("items", "readwrite");
  for (const item of newItems) {
    await tx.store.put({ ...item, report_id: reportId });
  }
  await tx.done;
}

export async function putReportItem(item: ReportItem) {
  const db = await getDB();
  await db.put("items", item);
}

export async function deleteReportItem(id: string) {
  const db = await getDB();
  await db.delete("items", id);
}

export async function getReportItems(reportId: string): Promise<ReportItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex("items", "by-report", reportId);
  return items.sort((a, b) => a.date_complete.localeCompare(b.date_complete));
}

const PROFILE_KEY = "scarwrite_company_profile";

export function loadCompanyProfile(): import("@/types/report").CompanyProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as import("@/types/report").CompanyProfile;
  } catch {
    return null;
  }
}

export function saveCompanyProfile(profile: import("@/types/report").CompanyProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
