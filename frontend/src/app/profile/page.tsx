"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile, ProfileObject } from "@/hooks/useProfile";

const DIET_OPTIONS = [
  "vegan",
  "vegetarian",
  "keto",
  "halal",
  "pescatarian",
  "gluten-free",
];
const ALLERGEN_OPTIONS = [
  "nuts",
  "gluten",
  "dairy",
  "soy",
  "shellfish",
  "eggs",
];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, saveProfile, clearProfile } = useProfile();

  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customExclusions, setCustomExclusions] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-populate from existing profile
  useEffect(() => {
    if (profile) {
      setSelectedDiets(profile.diet_tags);
      setSelectedAllergens(profile.allergen_tags);
      setCustomExclusions(profile.custom_exclusions);
    }
  }, [profile]);

  const toggleDiet = (tag: string) => {
    setSelectedDiets((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleAllergen = (tag: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileObj: ProfileObject = {
        diet_tags: selectedDiets,
        allergen_tags: selectedAllergens,
        custom_exclusions: customExclusions,
      };
      await saveProfile(profileObj);
      router.push("/");
    } catch {
      alert("Failed to save profile. Is the backend running?");
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearProfile();
    setSelectedDiets([]);
    setSelectedAllergens([]);
    setCustomExclusions("");
  };

  if (loading) {
    return (
      <div
        style={{
          background: "#F7F7F7",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#888", fontSize: 14 }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div
      style={{ background: "#F7F7F7", minHeight: "100vh", paddingBottom: 40 }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          padding: "16px 14px",
          borderBottom: "1px solid #E0E0E0",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push("/")}
          aria-label="Go back"
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            padding: 4,
          }}
        >
          ←
        </button>
        <h1
          style={{ fontSize: 16, fontWeight: 700, color: "#0F1111", margin: 0 }}
        >
          Dietary &amp; Allergy Profile
        </h1>
      </div>

      {/* Dietary Preferences */}
      <section
        style={{ background: "white", margin: "8px 0 0", padding: "16px 14px" }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F1111",
            margin: "0 0 12px",
          }}
        >
          🥗 Dietary Preferences
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DIET_OPTIONS.map((tag) => {
            const selected = selectedDiets.includes(tag);
            return (
              <button
                key={tag}
                role="checkbox"
                aria-checked={selected}
                aria-label={`${tag} diet`}
                onClick={() => toggleDiet(tag)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: selected ? "2px solid #4CAF50" : "1px solid #E0E0E0",
                  background: selected ? "#E8F5E9" : "white",
                  color: selected ? "#2E7D32" : "#333",
                  fontWeight: selected ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {selected ? "✓ " : ""}
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* Allergen Sensitivities */}
      <section
        style={{ background: "white", margin: "8px 0 0", padding: "16px 14px" }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F1111",
            margin: "0 0 12px",
          }}
        >
          ⚠️ Allergen Sensitivities
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALLERGEN_OPTIONS.map((tag) => {
            const selected = selectedAllergens.includes(tag);
            return (
              <button
                key={tag}
                role="checkbox"
                aria-checked={selected}
                aria-label={`${tag} allergy`}
                onClick={() => toggleAllergen(tag)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: selected ? "2px solid #E53935" : "1px solid #E0E0E0",
                  background: selected ? "#FFEBEE" : "white",
                  color: selected ? "#C62828" : "#333",
                  fontWeight: selected ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {selected ? "✓ " : ""}
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom Exclusions */}
      <section
        style={{ background: "white", margin: "8px 0 0", padding: "16px 14px" }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F1111",
            margin: "0 0 12px",
          }}
        >
          ✏️ Custom Exclusions
        </h2>
        <input
          type="text"
          value={customExclusions}
          onChange={(e) => setCustomExclusions(e.target.value)}
          placeholder="e.g. aspartame, palm oil, msg"
          aria-label="Custom exclusion keywords, comma separated"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #E0E0E0",
            borderRadius: 8,
            fontSize: 13,
            color: "#0F1111",
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>
          Comma-separated keywords to additionally exclude from results
        </p>
      </section>

      {/* Actions */}
      <div
        style={{
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            background: "#FFD814",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            color: "#0F1111",
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {profile && (
          <button
            onClick={handleClear}
            style={{
              width: "100%",
              padding: "12px",
              background: "white",
              border: "1px solid #E0E0E0",
              borderRadius: 8,
              fontSize: 13,
              color: "#888",
              cursor: "pointer",
            }}
          >
            Clear Profile
          </button>
        )}
      </div>
    </div>
  );
}
