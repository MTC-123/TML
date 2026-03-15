import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const teamMembers = [
  { key: "member1", role: "team.member1" },
  { key: "member2", role: "team.member2" },
  { key: "member3", role: "team.member3" },
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="py-20">
      <div className="container mx-auto max-w-3xl px-4">
        {/* About TML */}
        <h1 className="mb-4 text-3xl font-bold text-[#1e3a5f]">
          {t("title")}
        </h1>
        <p className="mb-4 text-muted-foreground leading-relaxed">
          {t("description")}
        </p>
        <p className="mb-4 text-muted-foreground leading-relaxed">
          {t("mission")}
        </p>

        <Separator className="my-12" />

        {/* Team */}
        <h2 className="mb-8 text-2xl font-bold text-[#1e3a5f]">
          {t("teamTitle")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {teamMembers.map((member) => (
            <Card key={member.key} className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] text-xl font-bold text-white">
                  T
                </div>
                <CardTitle className="mt-3 text-lg">{t("teamName")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t(member.role)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12" />

        {/* Supervisor */}
        <h2 className="mb-8 text-2xl font-bold text-[#1e3a5f]">
          {t("patronTitle")}
        </h2>
        <Card className="mx-auto max-w-xs text-center">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2d8a4e] text-xl font-bold text-white">
              S
            </div>
            <CardTitle className="mt-3 text-lg">{t("patron")}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
