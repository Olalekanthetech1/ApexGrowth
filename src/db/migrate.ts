import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './index.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

export async function migrateJsonToPostgres() {
  console.log('--- Starting JSON to PostgreSQL Migration ---');
  const jsonPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('No data/db.json file found, skipping JSON seed import.');
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse data/db.json:', e);
    return;
  }

  // 1. Admin Users
  if (data.adminUsers && Array.isArray(data.adminUsers)) {
    for (const u of data.adminUsers) {
      await db.insert(schema.adminUsers).values({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.active ?? true,
        passwordHash: u.passwordHash,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.adminUsers.id,
        set: {
          email: u.email,
          name: u.name,
          role: u.role,
          active: u.active ?? true,
          passwordHash: u.passwordHash,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.adminUsers.length} Admin Users.`);
  }

  // 2. Business Profile
  if (data.businessProfile) {
    const bp = data.businessProfile;
    await db.insert(schema.businessProfile).values({
      id: bp.id || 'bp_main',
      businessName: bp.businessName,
      tagline: bp.tagline,
      description: bp.description,
      email: bp.email,
      supportEmail: bp.supportEmail || bp.email,
      phone: bp.phone,
      whatsappNumber: bp.whatsappNumber,
      businessHours: bp.businessHours,
      logoUrl: bp.logoUrl,
      faviconUrl: bp.faviconUrl,
      createdAt: bp.createdAt ? new Date(bp.createdAt) : new Date(),
      updatedAt: bp.updatedAt ? new Date(bp.updatedAt) : new Date(),
    }).onConflictDoUpdate({
      target: schema.businessProfile.id,
      set: {
        businessName: bp.businessName,
        tagline: bp.tagline,
        description: bp.description,
        email: bp.email,
        supportEmail: bp.supportEmail || bp.email,
        phone: bp.phone,
        whatsappNumber: bp.whatsappNumber,
        businessHours: bp.businessHours,
        logoUrl: bp.logoUrl,
        faviconUrl: bp.faviconUrl,
        updatedAt: new Date(),
      },
    });
    console.log('Migrated Business Profile.');
  }

  // 3. Contact Settings
  if (data.contactSettings) {
    const cs = data.contactSettings;
    await db.insert(schema.contactSettings).values({
      id: cs.id || 'cs_main',
      businessEmail: cs.businessEmail,
      supportEmail: cs.supportEmail || cs.businessEmail,
      phone: cs.phone,
      whatsappNumber: cs.whatsappNumber,
      whatsappUrl: cs.whatsappUrl,
      whatsappPrefilledMessage: cs.whatsappPrefilledMessage,
      whatsappButtonText: cs.whatsappButtonText,
      floatingWhatsappEnabled: cs.floatingWhatsappEnabled ?? true,
      heroCtaEnabled: cs.heroCtaEnabled ?? true,
      pricingCtaEnabled: cs.pricingCtaEnabled ?? true,
      createdAt: cs.createdAt ? new Date(cs.createdAt) : new Date(),
      updatedAt: cs.updatedAt ? new Date(cs.updatedAt) : new Date(),
    }).onConflictDoUpdate({
      target: schema.contactSettings.id,
      set: {
        businessEmail: cs.businessEmail,
        supportEmail: cs.supportEmail || cs.businessEmail,
        phone: cs.phone,
        whatsappNumber: cs.whatsappNumber,
        whatsappUrl: cs.whatsappUrl,
        whatsappPrefilledMessage: cs.whatsappPrefilledMessage,
        whatsappButtonText: cs.whatsappButtonText,
        floatingWhatsappEnabled: cs.floatingWhatsappEnabled ?? true,
        heroCtaEnabled: cs.heroCtaEnabled ?? true,
        pricingCtaEnabled: cs.pricingCtaEnabled ?? true,
        updatedAt: new Date(),
      },
    });
    console.log('Migrated Contact Settings.');
  }

  // 4. Social Links
  if (data.socialLinks && Array.isArray(data.socialLinks)) {
    for (const sl of data.socialLinks) {
      await db.insert(schema.socialLinks).values({
        id: sl.id,
        platform: sl.platform,
        label: sl.label,
        url: sl.url,
        username: sl.username,
        enabled: sl.enabled ?? true,
        displayOrder: sl.displayOrder ?? 0,
        createdAt: sl.createdAt ? new Date(sl.createdAt) : new Date(),
        updatedAt: sl.updatedAt ? new Date(sl.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.socialLinks.id,
        set: {
          platform: sl.platform,
          label: sl.label,
          url: sl.url,
          username: sl.username,
          enabled: sl.enabled ?? true,
          displayOrder: sl.displayOrder ?? 0,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.socialLinks.length} Social Links.`);
  }

  // 5. Payment Methods
  if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
    for (const pm of data.paymentMethods) {
      await db.insert(schema.paymentMethods).values({
        id: pm.id,
        provider: pm.provider,
        displayName: pm.displayName,
        type: pm.type || 'payment_link',
        paymentUrl: pm.paymentUrl,
        currency: pm.currency || 'USD',
        description: pm.description || '',
        instructions: pm.instructions,
        active: pm.active ?? true,
        displayOrder: pm.displayOrder ?? 0,
        isDirectLink: pm.isDirectLink ?? true,
        configMetadata: pm.configMetadata || null,
        createdAt: pm.createdAt ? new Date(pm.createdAt) : new Date(),
        updatedAt: pm.updatedAt ? new Date(pm.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.paymentMethods.id,
        set: {
          provider: pm.provider,
          displayName: pm.displayName,
          type: pm.type || 'payment_link',
          paymentUrl: pm.paymentUrl,
          currency: pm.currency || 'USD',
          description: pm.description || '',
          instructions: pm.instructions,
          active: pm.active ?? true,
          displayOrder: pm.displayOrder ?? 0,
          isDirectLink: pm.isDirectLink ?? true,
          configMetadata: pm.configMetadata || null,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.paymentMethods.length} Payment Methods.`);
  }

  // 6. Services
  if (data.services && Array.isArray(data.services)) {
    for (const s of data.services) {
      await db.insert(schema.services).values({
        id: s.id,
        slug: s.slug,
        title: s.title,
        description: s.description,
        iconName: s.iconName || 'Zap',
        features: s.features || [],
        published: s.published ?? true,
        displayOrder: s.displayOrder ?? 0,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.services.id,
        set: {
          slug: s.slug,
          title: s.title,
          description: s.description,
          iconName: s.iconName || 'Zap',
          features: s.features || [],
          published: s.published ?? true,
          displayOrder: s.displayOrder ?? 0,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.services.length} Services.`);
  }

  // 7. Pricing Packages
  if (data.pricingPackages && Array.isArray(data.pricingPackages)) {
    for (const pkg of data.pricingPackages) {
      await db.insert(schema.pricingPackages).values({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        priceNaira: pkg.priceNaira,
        priceUsd: pkg.priceUsd,
        features: pkg.features || [],
        isFeatured: pkg.isFeatured ?? false,
        badgeText: pkg.badgeText,
        ctaText: pkg.ctaText || 'Get Started Now',
        ctaAction: pkg.ctaAction || 'contact',
        paymentMethodId: pkg.paymentMethodId || null,
        active: pkg.active ?? true,
        displayOrder: pkg.displayOrder ?? 0,
        createdAt: pkg.createdAt ? new Date(pkg.createdAt) : new Date(),
        updatedAt: pkg.updatedAt ? new Date(pkg.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.pricingPackages.id,
        set: {
          name: pkg.name,
          description: pkg.description,
          priceNaira: pkg.priceNaira,
          priceUsd: pkg.priceUsd,
          features: pkg.features || [],
          isFeatured: pkg.isFeatured ?? false,
          badgeText: pkg.badgeText,
          ctaText: pkg.ctaText || 'Get Started Now',
          ctaAction: pkg.ctaAction || 'contact',
          paymentMethodId: pkg.paymentMethodId || null,
          active: pkg.active ?? true,
          displayOrder: pkg.displayOrder ?? 0,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.pricingPackages.length} Pricing Packages.`);
  }

  // 8. Demos
  if (data.demos && Array.isArray(data.demos)) {
    for (const d of data.demos) {
      await db.insert(schema.demos).values({
        id: d.id,
        type: d.type,
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        active: d.active ?? true,
        displayOrder: d.displayOrder ?? 0,
        config: d.config || {},
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.demos.id,
        set: {
          type: d.type,
          title: d.title,
          subtitle: d.subtitle,
          description: d.description,
          active: d.active ?? true,
          displayOrder: d.displayOrder ?? 0,
          config: d.config || {},
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.demos.length} Demos.`);
  }

  // 9. FAQs
  if (data.faqs && Array.isArray(data.faqs)) {
    for (const f of data.faqs) {
      await db.insert(schema.faqs).values({
        id: f.id,
        question: f.question,
        answer: f.answer,
        published: f.published ?? true,
        displayOrder: f.displayOrder ?? 0,
        createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
        updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.faqs.id,
        set: {
          question: f.question,
          answer: f.answer,
          published: f.published ?? true,
          displayOrder: f.displayOrder ?? 0,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`Migrated ${data.faqs.length} FAQs.`);
  }

  // 10. Leads & Notes
  if (data.leads && Array.isArray(data.leads)) {
    for (const l of data.leads) {
      await db.insert(schema.leads).values({
        id: l.id,
        name: l.name,
        email: l.email,
        whatsapp: l.whatsapp,
        businessType: l.businessType,
        websiteUrl: l.websiteUrl,
        sellingDetails: l.sellingDetails,
        message: l.message,
        utmSource: l.utmSource,
        utmMedium: l.utmMedium,
        utmCampaign: l.utmCampaign,
        utmContent: l.utmContent,
        landingPage: l.landingPage,
        referrer: l.referrer,
        status: l.status || 'new',
        createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
        updatedAt: l.updatedAt ? new Date(l.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: schema.leads.id,
        set: {
          name: l.name,
          email: l.email,
          whatsapp: l.whatsapp,
          businessType: l.businessType,
          websiteUrl: l.websiteUrl,
          sellingDetails: l.sellingDetails,
          message: l.message,
          utmSource: l.utmSource,
          utmMedium: l.utmMedium,
          utmCampaign: l.utmCampaign,
          utmContent: l.utmContent,
          landingPage: l.landingPage,
          referrer: l.referrer,
          status: l.status || 'new',
          updatedAt: new Date(),
        },
      });

      if (l.notes && Array.isArray(l.notes)) {
        for (const n of l.notes) {
          await db.insert(schema.leadNotes).values({
            id: n.id,
            leadId: l.id,
            authorName: n.authorName || 'Lead Director',
            content: n.content,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          }).onConflictDoNothing();
        }
      }
    }
    console.log(`Migrated ${data.leads.length} Leads.`);
  }

  // 11. SEO Settings
  if (data.seoSettings) {
    const seo = data.seoSettings;
    await db.insert(schema.seoSettings).values({
      id: seo.id || 'seo_main',
      pageTitle: seo.pageTitle,
      metaDescription: seo.metaDescription,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage,
      favicon: seo.favicon,
      canonicalUrl: seo.canonicalUrl,
      robotsConfig: seo.robotsConfig,
      keywords: seo.keywords || [],
      updatedAt: seo.updatedAt ? new Date(seo.updatedAt) : new Date(),
    }).onConflictDoUpdate({
      target: schema.seoSettings.id,
      set: {
        pageTitle: seo.pageTitle,
        metaDescription: seo.metaDescription,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImage: seo.ogImage,
        favicon: seo.favicon,
        canonicalUrl: seo.canonicalUrl,
        robotsConfig: seo.robotsConfig,
        keywords: seo.keywords || [],
        updatedAt: new Date(),
      },
    });
    console.log('Migrated SEO Settings.');
  }

  // 12. Audit Logs
  if (data.auditLogs && Array.isArray(data.auditLogs)) {
    for (const al of data.auditLogs) {
      await db.insert(schema.auditLogs).values({
        id: al.id,
        adminEmail: al.adminEmail,
        action: al.action,
        entityType: al.entityType,
        entityId: al.entityId,
        details: al.details,
        ipAddress: al.ipAddress,
        timestamp: al.timestamp ? new Date(al.timestamp) : new Date(),
      }).onConflictDoNothing();
    }
    console.log(`Migrated ${data.auditLogs.length} Audit Logs.`);
  }

  console.log('--- PostgreSQL Data Migration Complete ---');
}
