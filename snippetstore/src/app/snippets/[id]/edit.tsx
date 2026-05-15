import { useLocalSearchParams } from "expo-router";
import { SnippetFormScreen } from "@/screens/SnippetFormScreen";

export default function EditSnippetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SnippetFormScreen snippetId={Number(id)} />;
}
