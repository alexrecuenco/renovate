import * as amazonMachineImage from './aws-machine-image';
import * as azureRestApi from './azure-rest-api';
import * as bazelModule from './bazel-module';
import * as cargo from './cargo';
import * as composer from './composer';
import * as conan from './conan';
import * as deb from './deb';
import * as debian from './debian';
import * as docker from './docker';
import * as git from './git';
import * as glasskube from './glasskube';
import * as goModDirective from './go-mod-directive';
import * as gradle from './gradle';
import * as hashicorp from './hashicorp';
import * as helm from './helm';
import * as hermit from './hermit';
import * as hex from './hex';
import * as ivy from './ivy';
import * as kubernetesApi from './kubernetes-api';
import * as loose from './loose';
import * as maven from './maven';
import * as nixpkgs from './nixpkgs';
import * as node from './node';
import * as npm from './npm';
import * as nuget from './nuget';
import * as pep440 from './pep440';
import * as perl from './perl';
import * as poetry from './poetry';
import * as python from './python';
import * as redhat from './redhat';
import * as regex from './regex';
import * as rez from './rez';
import * as rpm from './rpm';
import * as ruby from './ruby';
import * as semver from './semver';
import * as semverCoerced from './semver-coerced';
import * as swift from './swift';
import type { VersioningApi, VersioningApiConstructor } from './types';
import * as ubuntu from './ubuntu';
import * as unity3d from './unity3d';

const api = new Map<string, VersioningApi | VersioningApiConstructor>();
export default api;

api.set(amazonMachineImage.id, amazonMachineImage.api);
api.set(azureRestApi.id, azureRestApi.api);
api.set(bazelModule.id, bazelModule.api);
api.set(cargo.id, cargo.api);
api.set(composer.id, composer.api);
api.set(conan.id, conan.api);
api.set(deb.id, deb.api);
api.set(debian.id, debian.api);
api.set(docker.id, docker.api);
api.set(git.id, git.api);
api.set(glasskube.id, glasskube.api);
api.set(goModDirective.id, goModDirective.api);
api.set(gradle.id, gradle.api);
api.set(hashicorp.id, hashicorp.api);
api.set(helm.id, helm.api);
api.set(hermit.id, hermit.api);
api.set(hex.id, hex.api);
api.set(ivy.id, ivy.api);
api.set(kubernetesApi.id, kubernetesApi.api);
api.set(loose.id, loose.api);
api.set(maven.id, maven.api);
api.set(nixpkgs.id, nixpkgs.api);
api.set(node.id, node.api);
api.set(npm.id, npm.api);
api.set(nuget.id, nuget.api);
api.set(pep440.id, pep440.api);
api.set(perl.id, perl.api);
api.set(poetry.id, poetry.api);
api.set(python.id, python.api);
api.set(redhat.id, redhat.api);
api.set(regex.id, regex.api);
api.set(rez.id, rez.api);
api.set(rpm.id, rpm.api);
api.set(ruby.id, ruby.api);
api.set(semver.id, semver.api);
api.set(semverCoerced.id, semverCoerced.api);
api.set(swift.id, swift.api);
api.set(ubuntu.id, ubuntu.api);
api.set(unity3d.id, unity3d.api);
