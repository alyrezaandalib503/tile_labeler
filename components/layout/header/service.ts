import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Label } from "./type";

export function useService() {
    const queryClient = useQueryClient();

    const addLabel = useMutation({
        mutationFn: async (labels: Label[]) => {
            const res = await axios.post("/api/labels", labels, {
                headers: { "Content-Type": "application/json" },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels"] });
        },
    });

    return {addLabel};
}
