import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Label , Design } from "./type";

export function useService() {
    const queryClient = useQueryClient();

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
    });

    // GET all designs
    const getDesigns = useQuery({
        queryKey: ["designs"],
        queryFn: async () => {
            const res = await axios.get("/api/designs");
            return res.data as Design[];
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });

    // CREATE or UPDATE a design
    const upsertDesign = useMutation({
        mutationFn: async (formData: FormData) => {
            const hasId = formData.has("id");
            const res = await axios.request({
                url: "/api/designs",
                method: hasId ? "PUT" : "POST",
                data: formData,
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        },
    });

    // DELETE a design
    const deleteDesign = useMutation({
        mutationFn: async (id: number) => {
            const res = await axios.delete(`/api/designs?id=${id}`);
            return res.data;
        },
        onSuccess: () => {
            // @ts-ignore
            queryClient.invalidateQueries(["designs"]);
        },
    });


    return {getLabels , updateLabel , upsertDesign , deleteDesign , getDesigns};
}
