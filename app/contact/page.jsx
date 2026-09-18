import site from "@/data/site.json";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact",
  description: site.contact.lead,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title={site.contact.heading} lead={site.contact.lead} />
      <section className="container" style={{ paddingBottom: "var(--section)" }}>
        <ContactForm />
      </section>
    </>
  );
}
