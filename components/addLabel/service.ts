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

    const getLabels = useQuery({
        queryKey: ["labels"],
        queryFn: async () => {
            const res = await axios.get("/api/labels");
            return res.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        // enabled: false,
    });

    const updateLabel = useMutation({
        mutationFn: async (label: Label) => {
            const res = await axios.put("/api/labels", label);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels"] });
        },
    });

    const deleteLabel = useMutation({
        mutationFn: async (id: number) => {
            const res = await axios.delete("/api/labels", { data: { id } });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["labels"] });
        },
    });

    return {addLabel , updateLabel, deleteLabel , getLabels};
}
