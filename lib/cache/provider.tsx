"use client";

import type React from "react";
import {SWRConfig} from "swr";

import {swrConfig} from "./swr-config";

export function CacheProvider({children}: { children: React.ReactNode }) {
    return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
