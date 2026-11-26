"""Writes worker/seed.sql: starting tracks and the Azure courses (official Microsoft Learn links)."""
import json, time, os
now = int(time.time() * 1000)
q = lambda s: "'" + str(s).replace("'", "''") + "'"
out = []
def track(id, title, desc, color, sort):
    out.append(f"INSERT OR IGNORE INTO tracks (id,title,description,color,sort,created_at,updated_at) VALUES ({q(id)},{q(title)},{q(desc)},{q(color)},{sort},{now},{now});")
def course(id, track_id, title, desc, provider, url, level, sort, modules):
    out.append(f"INSERT OR IGNORE INTO courses (id,track_id,title,description,provider,url,level,published,sort,created_at,updated_at) VALUES ({q(id)},{q(track_id)},{q(title)},{q(desc)},{q(provider)},{q(url)},{q(level)},1,{sort},{now},{now});")
    for mi, (mtitle, lessons) in enumerate(modules):
        mid = f"{id}_m{mi+1}"
        out.append(f"INSERT OR IGNORE INTO modules (id,course_id,title,sort,created_at,updated_at) VALUES ({q(mid)},{q(id)},{q(mtitle)},{mi},{now},{now});")
        for li, (ltitle, ltype, lurl, body) in enumerate(lessons):
            out.append(f"INSERT OR IGNORE INTO lessons (id,module_id,title,type,url,minutes,body,links,published,sort,created_at,updated_at) VALUES ({q(mid+'_l'+str(li+1))},{q(mid)},{q(ltitle)},{q(ltype)},{q(lurl)},0,{q(body)},'[]',1,{li},{now},{now});")

ML = 'https://learn.microsoft.com/en-us/training/modules/'
MP = 'https://learn.microsoft.com/en-us/training/paths/'
STUDY = 'https://learn.microsoft.com/en-us/certifications/resources/study-guides/'
track('devops', 'DevOps', 'Linux, automation, containers, infrastructure as code, CI/CD and reliability.', '#3fa456', 0)
track('cloud', 'Cloud', 'Cloud platforms and certifications, starting with Microsoft Azure.', '#0078d4', 1)

read = 'Open the module on Microsoft Learn, work through every unit and the knowledge check, then mark this lesson done.'
course('az900', 'cloud', 'AZ-900: Azure Fundamentals',
       'The official Microsoft Learn path for the Azure Fundamentals exam: cloud concepts, Azure architecture and services, management and governance.',
       'microsoft-learn', 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/', 'Beginner', 0, [
    ('Describe cloud concepts', [
        ('Describe cloud computing', 'reading', ML + 'describe-cloud-compute/', read),
        ('Describe the benefits of using cloud services', 'reading', ML + 'describe-benefits-use-cloud-services/', read),
        ('Describe cloud service types', 'reading', ML + 'describe-cloud-service-types/', read)]),
    ('Describe Azure architecture and services', [
        ('Describe the core architectural components of Azure', 'reading', ML + 'describe-core-architectural-components-of-azure/', read),
        ('Describe Azure compute services', 'reading', ML + 'describe-azure-compute-networking-services/', read),
        ('Describe Azure networking services', 'reading', ML + 'describe-azure-networking-services/', read),
        ('Describe Azure storage services', 'reading', ML + 'describe-azure-storage-services/', read),
        ('Describe Azure identity, access, and security', 'reading', ML + 'describe-azure-identity-access-security/', read)]),
    ('Describe Azure management and governance', [
        ('Describe cost management in Azure', 'reading', ML + 'describe-cost-management-azure/', read),
        ('Describe features and tools in Azure for governance and compliance', 'reading', ML + 'describe-features-tools-azure-for-governance-compliance/', read),
        ('Describe features and tools for managing and deploying Azure resources', 'reading', ML + 'describe-features-tools-manage-deploy-azure-resources/', read),
        ('Describe monitoring tools in Azure', 'reading', ML + 'describe-monitoring-tools-azure/', read)]),
    ('Exam prep', [
        ('AZ-900 study guide', 'reading', STUDY + 'az-900', 'Read the skills measured and check each one against your notes. Revisit any lesson you are unsure about.')])])

path = 'Work through every module in this learning path on Microsoft Learn, including the labs, then mark this lesson done.'
course('az104', 'cloud', 'AZ-104: Azure Administrator',
       'The official Microsoft Learn course for the Azure Administrator exam: identities and governance, storage, compute, virtual networks, monitoring and backup.',
       'microsoft-learn', 'https://learn.microsoft.com/en-us/training/courses/az-104t00', 'Intermediate', 1, [
    ('Prerequisites for Azure administrators', [
        ('AZ-104: Prerequisites for Azure administrators', 'reading', MP + 'az-104-administrator-prerequisites/', path)]),
    ('Manage identities and governance', [
        ('Understand Microsoft Entra ID', 'reading', ML + 'understand-azure-active-directory/', read),
        ('Create, configure, and manage identities', 'reading', ML + 'create-configure-manage-identities/', read),
        ('Describe the core architectural components of Azure', 'reading', ML + 'describe-core-architectural-components-of-azure/', read),
        ('Azure Policy initiatives', 'reading', ML + 'sovereignty-policy-initiatives/', read),
        ('Secure your Azure resources with Azure role-based access control (Azure RBAC)', 'reading', ML + 'secure-azure-resources-with-rbac/', read),
        ('Allow users to reset their password with Microsoft Entra self-service password reset', 'reading', ML + 'allow-users-reset-their-password/', read)]),
    ('Implement and manage storage', [
        ('AZ-104: Implement and manage storage in Azure', 'reading', MP + 'az-104-manage-storage/', path)]),
    ('Deploy and manage compute resources', [
        ('AZ-104: Deploy and manage Azure compute resources', 'reading', MP + 'az-104-manage-compute-resources/', path)]),
    ('Configure and manage virtual networks', [
        ('AZ-104: Configure and manage virtual networks for Azure administrators', 'reading', MP + 'az-104-manage-virtual-networks/', path)]),
    ('Monitor and back up resources', [
        ('AZ-104: Monitor and back up Azure resources', 'reading', MP + 'az-104-monitor-backup-resources/', path)]),
    ('Exam prep', [
        ('AZ-104 study guide', 'reading', STUDY + 'az-104', 'Read the skills measured and check each one against your notes. Revisit any lesson you are unsure about.')])])

os.makedirs('worker', exist_ok=True)
open('worker/seed.sql', 'w').write('-- Starting content for SYAM Academy (safe to run again: INSERT OR IGNORE)\n' + '\n'.join(out) + '\n')
print(len(out), 'statements')
