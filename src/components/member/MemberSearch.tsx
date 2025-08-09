// src/components/member/MemberSearch.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Input,
  Select,
  Option,
  HelpText,
  Stack,
  Spinner,
  Card,
  Heading,
  Paragraph,
  Button,
} from "@twilio-paste/core";
import { searchMembers } from "../../api/member";
import { getChapters } from "../../api/chapter";
import { MemberProfileResponse, Chapter } from "../../types";

type MemberSearchProps = {
  onSelect?: (member: MemberProfileResponse) => void; // optional (single select)
  onChangeSelected?: (members: MemberProfileResponse[]) => void; // multi-select
  onSubmitSelection?: (members: MemberProfileResponse[]) => void; // multi-select
  allowMultiple?: boolean;
  excludeIds?: string[];
  initialChapterId?: string;
  initialName?: string;
  emptyStateText?: string;
  noResultsText?: string;
  label?: string;
};

const DEBOUNCE_MS = 500;
const MIN_LEN_NO_CHAPTER = 2;

const MemberSearch: React.FC<MemberSearchProps> = ({
  onSelect,
  onChangeSelected,
  allowMultiple = false,
  excludeIds = [],
  initialChapterId = "",
  initialName = "",
  emptyStateText = "Start typing a name or choose a chapter to search.",
  noResultsText = "No members found. Try refining your search.",
  label = "Search members",
}) => {
  const nameLabel = "Name";
  const selectLabel = allowMultiple ? "Select" : "Select";

  const [name, setName] = useState(initialName);
  const [chapterId, setChapterId] = useState<string>(initialChapterId);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [results, setResults] = useState<MemberProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // multi-select selection
  const [selected, setSelected] = useState<MemberProfileResponse[]>([]);

  // Load chapters once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getChapters();
        if (!cancelled) setChapters(data);
      } catch {
        if (!cancelled) setChapters([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced search based ONLY on name + chapterId
  useEffect(() => {
    let cancelled = false;
    const trimmed = name.trim();

    const canSearch =
      (chapterId && chapterId.length > 0) ||
      trimmed.length >= MIN_LEN_NO_CHAPTER;

    if (!canSearch) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await searchMembers(trimmed || "", chapterId || "");
        if (!cancelled) {
          // Filter with current excludeIds here (no need to depend on it)
          const filtered = excludeIds.length
            ? res.filter((m) => !excludeIds.includes(m.member_id))
            : res;
          setResults(filtered);
        }
      } catch {
        if (!cancelled) setError("Failed to search members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, chapterId]); // <-- excludeIds removed here

  // If excludeIds changes later, just refilter current results (no network)
  useEffect(() => {
    if (!excludeIds.length) return;
    setResults((prev) => prev.filter((m) => !excludeIds.includes(m.member_id)));
    // Also drop any selected that became excluded
    setSelected((prev) =>
      prev.filter((m) => !excludeIds.includes(m.member_id))
    );
  }, [excludeIds]);

  // Keep parent informed on selection changes (multi-select)
  useEffect(() => {
    if (allowMultiple && onChangeSelected) {
      onChangeSelected(selected);
    }
  }, [selected, allowMultiple, onChangeSelected]);

  const showMinLenHint = useMemo(() => {
    return (
      (!chapterId || chapterId.length === 0) &&
      name.trim().length > 0 &&
      name.trim().length < MIN_LEN_NO_CHAPTER
    );
  }, [name, chapterId]);

  const toggleSelect = (m: MemberProfileResponse) => {
    if (!allowMultiple) {
      onSelect?.(m); // single select callback
      return;
    }
    setSelected((prev) => {
      const exists = prev.find((x) => x.member_id === m.member_id);
      if (exists) return prev.filter((x) => x.member_id !== m.member_id);
      return [...prev, m];
    });
  };

  const isSelected = (id: string) => !!selected.find((m) => m.member_id === id);

  return (
    <Box>
      <Heading as="h4" variant="heading40">
        {label}
      </Heading>

      <Stack orientation={["vertical", "horizontal"]} spacing="space40">
        <Box flexGrow={1} flexBasis="0" width="100%">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={nameLabel}
            insertAfter={null}
          />
          {showMinLenHint && (
            <HelpText variant="default">
              Type at least {MIN_LEN_NO_CHAPTER} characters to search by name,
              or choose a chapter.
            </HelpText>
          )}
        </Box>

        <Box width={["100%", "280px"]}>
          <Select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
          >
            <Option value="">Chapter: All</Option>
            {chapters.map((c) => (
              <Option key={c.chapter_id} value={c.chapter_id}>
                {c.chapter_name}
              </Option>
            ))}
          </Select>
        </Box>
      </Stack>

      <Box marginTop="space60">
        {error ? (
          <Card>
            <Paragraph>{error}</Paragraph>
          </Card>
        ) : loading ? (
          <Box display="flex" columnGap="space30" alignItems="center">
            <Spinner decorative={false} title="Searching…" size="sizeIcon40" />
            <Paragraph>Searching…</Paragraph>
          </Box>
        ) : results.length === 0 ? (
          <Card>
            <Paragraph>
              {name.trim().length === 0 && !chapterId
                ? emptyStateText
                : noResultsText}
            </Paragraph>
          </Card>
        ) : (
          <>
            <Stack orientation="vertical" spacing="space30">
              {results.map((m) => {
                const fullName =
                  `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() ||
                  m.member_id;
                const selectedFlag = isSelected(m.member_id);
                return (
                  <Card key={m.member_id}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Heading as="h5" variant="heading50">
                          {fullName}
                        </Heading>
                        <>
                          {m.chapters.map((chapter, idx) => (
                            <div key={`chapter-${idx}`}>
                              {chapter.affiliation_type} with{" "}
                              {chapter.chapter_name}
                            </div>
                          ))}
                        </>
                      </Box>
                      <Button
                        variant={selectedFlag ? "secondary" : "primary"}
                        onClick={() => toggleSelect(m)}
                      >
                        {selectedFlag ? "Selected" : selectLabel}
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MemberSearch;
