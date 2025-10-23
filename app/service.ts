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
        enabled: true,
    });

    const updateLabel = useMutation({
        mutationFn: async (label: Label) => {
            const res = await axios.put("/api/labels", label); // id داخل body
            return res.data;
        },
    });

    const deleteLabel = useMutation({
        mutationFn: async (id: number) => {
            const res = await axios.delete("/api/labels", { data: { id } }); // id داخل body
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
    });

    // CREATE or UPDATE a design
     const upsertDesign = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await axios.post("/api/designs", formData);
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


    return {getLabels, deleteLabel , updateLabel , upsertDesign , deleteDesign , getDesigns};
}
