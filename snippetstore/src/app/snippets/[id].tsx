import { useLocalSearchParams } from "expo-router";
import { SnippetDetailScreen } from "@/screens/SnippetDetailScreen";

export default function SnippetDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SnippetDetailScreen snippetId={Number(id)} />;
}
